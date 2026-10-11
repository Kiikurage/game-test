// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform3_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform3 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform5_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform5 : texture_3d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform15_sampler : sampler;
@binding( 6 ) @group( 1 ) var nodeUniform15 : texture_2d<f32>;
@binding( 7 ) @group( 1 ) var nodeUniform23_sampler : sampler;
@binding( 8 ) @group( 1 ) var nodeUniform23 : texture_2d<f32>;
@binding( 9 ) @group( 1 ) var nodeUniform36_sampler : sampler_comparison;
@binding( 10 ) @group( 1 ) var nodeUniform36 : texture_depth_2d;

struct objectStruct {
	nodeUniform0 : mat4x4<f32>,
	nodeUniform2 : mat4x4<f32>,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform6 : f32,
	nodeUniform7 : mat4x4<f32>,
	nodeUniform8 : f32,
	nodeUniform9 : f32,
	nodeUniform10 : f32,
	nodeUniform12 : mat3x3<f32>,
	nodeUniform13 : f32,
	nodeUniform14 : vec3<f32>,
	nodeUniform16 : mat3x3<f32>,
	nodeUniform17 : vec2<f32>,
	nodeUniform20 : vec3<f32>,
	nodeUniform21 : vec3<f32>,
	nodeUniform22 : f32,
	nodeUniform44 : vec3<f32>,
	nodeUniform45 : vec3<f32>,
	nodeUniform46 : vec3<f32>,
	nodeUniform47 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform24 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform41 : vec3<f32>,
	nodeUniform42 : f32,
	nodeUniform43 : f32,
	nodeUniform27 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform31 : vec3<f32>,
	nodeUniform40 : vec3<f32>,
	nodeUniform33 : mat4x4<f32>,
	nodeUniform34 : f32,
	nodeUniform35 : f32,
	nodeUniform39 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform37 : f32,
	nodeUniform38 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar1 : vec4<f32>;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : f32;
var<private> nodeVar9 : vec3<f32>;
var<private> nodeVar10 : f32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar11 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> NORMAL_normalView : vec3<f32>;
var<private> nodeVar14 : vec3<f32>;
var<private> nodeVar15 : vec2<f32>;
var<private> nodeVar16 : vec3<f32>;
var<private> nodeVar17 : vec2<f32>;
var<private> nodeVar18 : vec3<f32>;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : vec3<f32>;
var<private> nodeVar21 : f32;
var<private> tangentViewFrame : vec3<f32>;
var<private> NORMAL_tangentView : vec3<f32>;
var<private> bitangentViewFrame : vec3<f32>;
var<private> NORMAL_bitangentView : vec3<f32>;
var<private> NORMAL_TBNViewMatrix : mat3x3<f32>;
var<private> nodeVar22 : vec4<f32>;
var<private> nodeVar23 : vec4<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar24 : vec3<f32>;
var<private> nodeVar25 : vec3<f32>;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : vec2<f32>;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : vec3<f32>;
var<private> nodeVar36 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : vec4<f32>;
var<private> nodeVar44 : vec4<f32>;
var<private> nodeVar45 : vec3<f32>;
var<private> nodeVar46 : vec3<f32>;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec4<f32>;
var<private> nodeVar72 : vec4<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : vec4<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : f32;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : vec2<f32>;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : vec2<f32>;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : vec2<f32>;
var<private> nodeVar87 : f32;
var<private> nodeVar88 : vec2<f32>;
var<private> nodeVar89 : f32;
var<private> nodeVar90 : vec2<f32>;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : f32;
var<private> nodeVar109 : f32;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : f32;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : f32;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : f32;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : f32;
var<private> nodeVar139 : f32;
var<private> nodeVar140 : f32;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : f32;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : f32;
var<private> nodeVar157 : f32;
var<private> nodeVar158 : f32;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : f32;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : f32;
var<private> nodeVar183 : f32;
var<private> nodeVar184 : f32;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : f32;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : f32;
var<private> nodeVar201 : f32;
var<private> nodeVar202 : f32;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : f32;
var<private> nodeVar226 : f32;
var<private> nodeVar227 : f32;
var<private> nodeVar228 : f32;
var<private> nodeVar229 : f32;
var<private> nodeVar230 : f32;
var<private> nodeVar231 : f32;
var<private> nodeVar232 : f32;
var<private> nodeVar233 : f32;
var<private> nodeVar234 : f32;
var<private> nodeVar235 : f32;
var<private> nodeVar236 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : f32;
var<private> nodeVar241 : vec4<f32>;

// codes
fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@location( 4 ) nodeVarying7 : vec2<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar1 = textureSample( nodeUniform3, nodeUniform3_sampler, ( object.nodeUniform4 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	nodeVar2 = dot( ( nodeVar1.xyz * vec3<f32>( 1.0, 1.0, 1.0 ) ), vec3<f32>( 0.2126, 0.7152, 0.0722 ) );
	nodeVar3 = textureSample( nodeUniform5, nodeUniform5_sampler, ( vec3<f32>( ( nodeVarying7 * vec2<f32>( 9.0 ) ), 0.37 ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar4 = mix( -0.11, 1.01, object.nodeUniform6 );
	nodeVar5 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( v_positionWorld * vec3<f32>( 4.2 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar6 = clamp( ( ( nodeVar5 * 0.9 ) + 0.5 ), 0.0, 1.0 );
	nodeVar7 = ( 1.0 - smoothstep( nodeVar4, ( nodeVar4 + 0.1 ), nodeVar6 ) );
	nodeVar8 = ( nodeVar7 * nodeVar7 );
	nodeVar9 = mix( mix( ( ( vec3<f32>( 0.1499597898006365, 0.16826940017946088, 0.16202937562896222 ) * vec3<f32>( ( ( nodeVar2 * 1.6 ) + 0.45 ) ) ) * vec3<f32>( 3.4 ) ), ( ( vec3<f32>( 0.04231141061442144, 0.061246054224174035, 0.08021982030622662 ) * vec3<f32>( ( nodeVar2 + 0.4 ) ) ) * vec3<f32>( 3.4 ) ), ( smoothstep( -0.35, 0.6, nodeVar3 ) * 0.5 ) ), vec3<f32>( 0.007499032040460618, 0.005605391621829108, 0.004776953478513362 ), ( nodeVar8 * 0.9 ) );
	DiffuseColor = vec4<f32>( nodeVar9, 1.0 );

	if ( ( nodeVar6 > nodeVar4 ) ) {

		nodeVar10 = 1.0;

	} else {

		nodeVar10 = 0.0;

	}

	DiffuseColor.w = ( DiffuseColor.w * nodeVar10 );

	if ( ( DiffuseColor.w <= object.nodeUniform8 ) ) {

		discard;
		

	}

	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform9;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar11 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform10, 0.0525 ) + max( max( nodeVar11.x, nodeVar11.y ), nodeVar11.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform9 ) ) );
	nodeVar12 = textureSample( nodeUniform5, nodeUniform5_sampler, ( vec3<f32>( ( nodeVarying7 * vec2<f32>( 30.0 ) ), 0.37 ) / vec3<f32>( 8.0 ) ) ).x;

	if ( ( object.nodeUniform6 > 0.0 ) ) {

		nodeVar13 = 3.2;

	} else {

		nodeVar13 = 0.0;

	}

	NORMAL_normalView = normalViewGeometry;
	nodeVar14 = cross( - dpdy( v_positionView ), NORMAL_normalView );
	nodeVar15 = dpdx( nodeVarying7 );
	nodeVar16 = cross( NORMAL_normalView, dpdx( v_positionView ) );
	nodeVar17 = - dpdy( nodeVarying7 );
	nodeVar18 = ( ( nodeVar14 * vec3<f32>( nodeVar15.x ) ) + ( nodeVar16 * vec3<f32>( nodeVar17.x ) ) );
	nodeVar20 = ( ( nodeVar14 * vec3<f32>( nodeVar15.y ) ) + ( nodeVar16 * vec3<f32>( nodeVar17.y ) ) );
	nodeVar21 = max( dot( nodeVar18, nodeVar18 ), dot( nodeVar20, nodeVar20 ) );

	if ( ( nodeVar21 == 0.0 ) ) {

		nodeVar19 = 0.0;

	} else {

		nodeVar19 = inverseSqrt( nodeVar21 );

	}

	tangentViewFrame = ( nodeVar18 * vec3<f32>( nodeVar19 ) );
	NORMAL_tangentView = tangentViewFrame;
	bitangentViewFrame = ( nodeVar20 * nodeVar19 );
	NORMAL_bitangentView = bitangentViewFrame;
	NORMAL_TBNViewMatrix = mat3x3<f32>( NORMAL_tangentView, NORMAL_bitangentView, NORMAL_normalView );
	nodeVar22 = textureSample( nodeUniform15, nodeUniform15_sampler, ( object.nodeUniform16 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	nodeVar23 = ( ( nodeVar22 * vec4<f32>( 2.0 ) ) - vec4<f32>( 1.0 ) );
	normalView = normalize( ( NORMAL_TBNViewMatrix * vec3<f32>( ( nodeVar23.xy * object.nodeUniform17 ), nodeVar23.z ) ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar24 = normalize( normalWorld );
	nodeVar25 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar26 = pow( ( 1.0 - clamp( dot( nodeVar24, nodeVar25 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar27 = smoothstep( -0.35, 0.55, dot( nodeVar24, object.nodeUniform20 ) );
	nodeVar28 = smoothstep( -0.15, 0.85, ( - dot( nodeVar25, object.nodeUniform20 ) ) );
	EmissiveColor = ( ( ( ( ( ( mix( vec3<f32>( 0.34670405634441115, 0.6866853124288864, 1.0 ), vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ), object.nodeUniform13 ) * vec3<f32>( clamp( ( ( 0.0 + ( 1.0 - smoothstep( 0.0043749999999999995, 0.0125, length( ( nodeVarying7 - vec2<f32>( 0.139, 0.252 ) ) ) ) ) ) + ( 1.0 - smoothstep( 0.0043749999999999995, 0.0125, length( ( nodeVarying7 - vec2<f32>( 0.231, 0.252 ) ) ) ) ) ), 0.0, 1.0 ) ) ) * vec3<f32>( 0.0 ) ) * vec3<f32>( 1.6 ) ) + ( ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( object.nodeUniform13 ) ) * vec3<f32>( ( 1.0 - smoothstep( 0.0, 0.035, abs( nodeVar12 ) ) ) ) ) * vec3<f32>( 0.6 ) ) ) + ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( smoothstep( 0.35, 1.0, nodeVar7 ) ) ) * vec3<f32>( nodeVar13 ) ) ) + ( mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( object.nodeUniform14 * vec3<f32>( nodeVar26 ) ) * vec3<f32>( nodeVar27 ) ) * vec3<f32>( ( ( nodeVar28 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform21 * vec3<f32>( nodeVar26 ) ) * vec3<f32>( ( 1.0 - ( nodeVar27 * nodeVar28 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( ( nodeVar9 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar9, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform22 ) * vec3<f32>( ( 1.0 - nodeVar8 ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar29 = dot( normalView, positionViewDirection );
	nodeVar30 = textureSample( nodeUniform23, nodeUniform23_sampler, vec2<f32>( Roughness, clamp( nodeVar29, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar30;
	nodeVar31 = ( dfg.x + dfg.y );
	nodeVar32 = ( 1.0 / nodeVar31 );
	nodeVar33 = nodeVar32;
	nodeVar34 = ( nodeVar33 - 1.0 );
	nodeVar35 = ( SpecularColorBlended * vec3<f32>( nodeVar34 ) );
	nodeVar36 = ( nodeVar35 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar36;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar37 = dot( normalWorld, normalize( render.nodeUniform26 ) );
	nodeVar38 = ( nodeVar37 * 0.5 );
	nodeVar39 = ( nodeVar38 + 0.5 );
	nodeVar40 = mix( render.nodeUniform24, render.nodeUniform25, nodeVar39 );
	nodeVar41 = ( irradiance + nodeVar40 );
	irradiance = nodeVar41;
	nodeVar42 = ( render.nodeUniform27 - render.nodeUniform28 );
	nodeVar43 = vec4<f32>( nodeVar42, 0.0 );
	nodeVar44 = ( render.cameraViewMatrix * nodeVar43 );
	nodeVar45 = normalize( nodeVar44.xyz );
	nodeVar46 = nodeVar45;
	nodeVar47 = dot( normalView, nodeVar46 );
	nodeVar48 = ( vec3<f32>( clamp( nodeVar47, 0.0, 1.0 ) ) * render.nodeUniform29 );
	nodeVar49 = nodeVar48;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar50 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar51 = ( nodeVar49 * nodeVar50 );
	nodeVar52 = ( nodeVar46 + positionViewDirection );
	nodeVar53 = normalize( nodeVar52 );
	nodeVar54 = dot( positionViewDirection, nodeVar53 );
	nodeVar55 = clamp( nodeVar54, 0.0, 1.0 );
	nodeVar56 = exp2( ( ( ( nodeVar55 * -5.55473 ) - 6.98316 ) * nodeVar55 ) );
	nodeVar57 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar56 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar56 ) ) );
	nodeVar58 = ( vec3<f32>( 1.0 ) - nodeVar57 );
	nodeVar59 = nodeVar58;
	nodeVar60 = ( nodeVar51 * nodeVar59 );
	nodeVar61 = ( directDiffuse + nodeVar60 );
	directDiffuse = nodeVar61;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar62 = normalize( ( nodeVar46 + positionViewDirection ) );
	nodeVar63 = clamp( dot( positionViewDirection, nodeVar62 ), 0.0, 1.0 );
	nodeVar64 = exp2( ( ( ( nodeVar63 * -5.55473 ) - 6.98316 ) * nodeVar63 ) );
	nodeVar65 = ( Roughness * Roughness );
	nodeVar66 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar64 ) ) ) + vec3<f32>( ( 1.0 * nodeVar64 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar65, clamp( dot( normalView, nodeVar46 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar65, clamp( dot( normalView, nodeVar62 ), 0.0, 1.0 ) ) ) );
	nodeVar67 = ( nodeVar49 * nodeVar66 );
	nodeVar68 = ( nodeVar67 * multiScatteringCompensation );
	nodeVar69 = ( directSpecular + nodeVar68 );
	directSpecular = nodeVar69;
	nodeVar70 = ( render.nodeUniform30 - render.nodeUniform31 );
	nodeVar71 = vec4<f32>( nodeVar70, 0.0 );
	nodeVar72 = ( render.cameraViewMatrix * nodeVar71 );
	nodeVar73 = normalize( nodeVar72.xyz );
	nodeVar74 = nodeVar73;
	nodeVar75 = dot( normalView, nodeVar74 );
	shadowPositionWorld = v_positionWorld;
	nodeVar77 = ( render.nodeUniform33 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform34 ) ) ), 1.0 ) );
	nodeVar78 = ( nodeVar77.xyz / vec3<f32>( nodeVar77.w ) );
	nodeVar79 = vec3<f32>( nodeVar78.x, ( 1.0 - nodeVar78.y ), ( nodeVar78.z + render.nodeUniform35 ) );

	if ( ( ( ( ( ( nodeVar79.x >= 0.0 ) && ( nodeVar79.x <= 1.0 ) ) && ( nodeVar79.y >= 0.0 ) ) && ( nodeVar79.y <= 1.0 ) ) && ( nodeVar79.z <= 1.0 ) ) ) {

		nodeVar80 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar81 = ( render.nodeUniform37 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform38 ).x );
		nodeVar82 = ( nodeVar79.xy + ( vogelDiskSample( 0, 5, nodeVar80 ) * vec2<f32>( nodeVar81 ) ) );
		nodeVar83 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar82, nodeVar79.z );
		nodeVar84 = ( nodeVar79.xy + ( vogelDiskSample( 1, 5, nodeVar80 ) * vec2<f32>( nodeVar81 ) ) );
		nodeVar85 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar84, nodeVar79.z );
		nodeVar86 = ( nodeVar79.xy + ( vogelDiskSample( 2, 5, nodeVar80 ) * vec2<f32>( nodeVar81 ) ) );
		nodeVar87 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar86, nodeVar79.z );
		nodeVar88 = ( nodeVar79.xy + ( vogelDiskSample( 3, 5, nodeVar80 ) * vec2<f32>( nodeVar81 ) ) );
		nodeVar89 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar88, nodeVar79.z );
		nodeVar90 = ( nodeVar79.xy + ( vogelDiskSample( 4, 5, nodeVar80 ) * vec2<f32>( nodeVar81 ) ) );
		nodeVar91 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar90, nodeVar79.z );
		nodeVar76 = ( ( ( ( ( nodeVar83 + nodeVar85 ) + nodeVar87 ) + nodeVar89 ) + nodeVar91 ) * 0.2 );

	} else {

		nodeVar76 = 1.0;

	}

	nodeVar92 = mix( 1.0, nodeVar76, render.nodeUniform39 );
	nodeVar93 = ( vec3<f32>( clamp( nodeVar75, 0.0, 1.0 ) ) * ( render.nodeUniform32 * vec3<f32>( nodeVar92 ) ) );
	nodeVar94 = nodeVar93;
	nodeVar95 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar96 = ( nodeVar94 * nodeVar95 );
	nodeVar97 = ( nodeVar74 + positionViewDirection );
	nodeVar98 = normalize( nodeVar97 );
	nodeVar99 = dot( positionViewDirection, nodeVar98 );
	nodeVar100 = clamp( nodeVar99, 0.0, 1.0 );
	nodeVar101 = exp2( ( ( ( nodeVar100 * -5.55473 ) - 6.98316 ) * nodeVar100 ) );
	nodeVar102 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar101 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar101 ) ) );
	nodeVar103 = ( vec3<f32>( 1.0 ) - nodeVar102 );
	nodeVar104 = nodeVar103;
	nodeVar105 = ( nodeVar96 * nodeVar104 );
	nodeVar106 = ( directDiffuse + nodeVar105 );
	directDiffuse = nodeVar106;
	nodeVar107 = normalize( ( nodeVar74 + positionViewDirection ) );
	nodeVar108 = clamp( dot( positionViewDirection, nodeVar107 ), 0.0, 1.0 );
	nodeVar109 = exp2( ( ( ( nodeVar108 * -5.55473 ) - 6.98316 ) * nodeVar108 ) );
	nodeVar110 = ( Roughness * Roughness );
	nodeVar111 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar109 ) ) ) + vec3<f32>( ( 1.0 * nodeVar109 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar110, clamp( dot( normalView, nodeVar74 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar110, clamp( dot( normalView, nodeVar107 ), 0.0, 1.0 ) ) ) );
	nodeVar112 = ( nodeVar94 * nodeVar111 );
	nodeVar113 = ( nodeVar112 * multiScatteringCompensation );
	nodeVar114 = ( directSpecular + nodeVar113 );
	directSpecular = nodeVar114;
	nodeVar115 = ( render.nodeUniform40 - v_positionView );
	nodeVar116 = normalize( nodeVar115 );
	nodeVar117 = dot( normalView, nodeVar116 );

	if ( ( render.nodeUniform42 > 0.0 ) ) {

		nodeVar119 = length( nodeVar115 );
		nodeVar120 = ( nodeVar119 / render.nodeUniform42 );
		nodeVar121 = clamp( ( 1.0 - ( ( ( nodeVar120 * nodeVar120 ) * nodeVar120 ) * nodeVar120 ) ), 0.0, 1.0 );
		nodeVar118 = ( ( 1.0 / max( pow( nodeVar119, render.nodeUniform43 ), 0.01 ) ) * ( nodeVar121 * nodeVar121 ) );

	} else {

		nodeVar118 = ( 1.0 / max( pow( length( nodeVar115 ), render.nodeUniform43 ), 0.01 ) );

	}

	nodeVar122 = ( render.nodeUniform41 * vec3<f32>( nodeVar118 ) );
	nodeVar123 = ( vec3<f32>( clamp( nodeVar117, 0.0, 1.0 ) ) * nodeVar122 );
	nodeVar124 = nodeVar123;
	nodeVar125 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar126 = ( nodeVar124 * nodeVar125 );
	nodeVar127 = ( nodeVar116 + positionViewDirection );
	nodeVar128 = normalize( nodeVar127 );
	nodeVar129 = dot( positionViewDirection, nodeVar128 );
	nodeVar130 = clamp( nodeVar129, 0.0, 1.0 );
	nodeVar131 = exp2( ( ( ( nodeVar130 * -5.55473 ) - 6.98316 ) * nodeVar130 ) );
	nodeVar132 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar131 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar131 ) ) );
	nodeVar133 = ( vec3<f32>( 1.0 ) - nodeVar132 );
	nodeVar134 = nodeVar133;
	nodeVar135 = ( nodeVar126 * nodeVar134 );
	nodeVar136 = ( directDiffuse + nodeVar135 );
	directDiffuse = nodeVar136;
	nodeVar137 = normalize( ( nodeVar116 + positionViewDirection ) );
	nodeVar138 = clamp( dot( positionViewDirection, nodeVar137 ), 0.0, 1.0 );
	nodeVar139 = exp2( ( ( ( nodeVar138 * -5.55473 ) - 6.98316 ) * nodeVar138 ) );
	nodeVar140 = ( Roughness * Roughness );
	nodeVar141 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar139 ) ) ) + vec3<f32>( ( 1.0 * nodeVar139 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar140, clamp( dot( normalView, nodeVar116 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar140, clamp( dot( normalView, nodeVar137 ), 0.0, 1.0 ) ) ) );
	nodeVar142 = ( nodeVar124 * nodeVar141 );
	nodeVar143 = ( nodeVar142 * multiScatteringCompensation );
	nodeVar144 = ( directSpecular + nodeVar143 );
	directSpecular = nodeVar144;
	nodeVar145 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar146 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar147 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar148 = ( SpecularF90 * dfg.y );
	nodeVar149 = ( nodeVar147 + vec3<f32>( nodeVar148 ) );
	nodeVar150 = ( nodeVar145 + nodeVar149 );
	nodeVar145 = nodeVar150;
	nodeVar151 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar152 = nodeVar151;
	nodeVar153 = ( nodeVar152 * vec3<f32>( 0.047619 ) );
	nodeVar154 = ( SpecularColor + nodeVar153 );
	nodeVar155 = ( nodeVar149 * nodeVar154 );
	nodeVar156 = ( dfg.x + dfg.y );
	nodeVar157 = ( 1.0 - nodeVar156 );
	nodeVar158 = nodeVar157;
	nodeVar159 = ( vec3<f32>( nodeVar158 ) * nodeVar154 );
	nodeVar160 = ( vec3<f32>( 1.0 ) - nodeVar159 );
	nodeVar161 = nodeVar160;
	nodeVar162 = ( nodeVar155 / nodeVar161 );
	nodeVar163 = ( nodeVar162 * vec3<f32>( nodeVar158 ) );
	nodeVar164 = ( nodeVar146 + nodeVar163 );
	nodeVar146 = nodeVar164;
	nodeVar165 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar166 = ( irradiance * nodeVar165 );
	nodeVar167 = ( nodeVar145 + nodeVar146 );
	nodeVar168 = ( vec3<f32>( 1.0 ) - nodeVar167 );
	nodeVar169 = nodeVar168;
	nodeVar170 = ( nodeVar166 * nodeVar169 );
	nodeVar171 = nodeVar170;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar172 = ( indirectDiffuse + nodeVar171 );
	indirectDiffuse = nodeVar172;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar173 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar174 = ( SpecularF90 * dfg.y );
	nodeVar175 = ( nodeVar173 + vec3<f32>( nodeVar174 ) );
	nodeVar176 = ( singleScatteringDielectric + nodeVar175 );
	singleScatteringDielectric = nodeVar176;
	nodeVar177 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar178 = nodeVar177;
	nodeVar179 = ( nodeVar178 * vec3<f32>( 0.047619 ) );
	nodeVar180 = ( SpecularColor + nodeVar179 );
	nodeVar181 = ( nodeVar175 * nodeVar180 );
	nodeVar182 = ( dfg.x + dfg.y );
	nodeVar183 = ( 1.0 - nodeVar182 );
	nodeVar184 = nodeVar183;
	nodeVar185 = ( vec3<f32>( nodeVar184 ) * nodeVar180 );
	nodeVar186 = ( vec3<f32>( 1.0 ) - nodeVar185 );
	nodeVar187 = nodeVar186;
	nodeVar188 = ( nodeVar181 / nodeVar187 );
	nodeVar189 = ( nodeVar188 * vec3<f32>( nodeVar184 ) );
	nodeVar190 = ( multiScatteringDielectric + nodeVar189 );
	multiScatteringDielectric = nodeVar190;
	nodeVar191 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar192 = ( SpecularF90 * dfg.y );
	nodeVar193 = ( nodeVar191 + vec3<f32>( nodeVar192 ) );
	nodeVar194 = ( singleScatteringMetallic + nodeVar193 );
	singleScatteringMetallic = nodeVar194;
	nodeVar195 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar196 = nodeVar195;
	nodeVar197 = ( nodeVar196 * vec3<f32>( 0.047619 ) );
	nodeVar198 = ( DiffuseColor.xyz + nodeVar197 );
	nodeVar199 = ( nodeVar193 * nodeVar198 );
	nodeVar200 = ( dfg.x + dfg.y );
	nodeVar201 = ( 1.0 - nodeVar200 );
	nodeVar202 = nodeVar201;
	nodeVar203 = ( vec3<f32>( nodeVar202 ) * nodeVar198 );
	nodeVar204 = ( vec3<f32>( 1.0 ) - nodeVar203 );
	nodeVar205 = nodeVar204;
	nodeVar206 = ( nodeVar199 / nodeVar205 );
	nodeVar207 = ( nodeVar206 * vec3<f32>( nodeVar202 ) );
	nodeVar208 = ( multiScatteringMetallic + nodeVar207 );
	multiScatteringMetallic = nodeVar208;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar209 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar210 = ( radiance * nodeVar209 );
	nodeVar211 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar212 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar213 = ( nodeVar211 * nodeVar212 );
	nodeVar214 = ( nodeVar210 + nodeVar213 );
	nodeVar215 = nodeVar214;
	nodeVar216 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar217 = ( vec3<f32>( 1.0 ) - nodeVar216 );
	nodeVar218 = nodeVar217;
	nodeVar219 = ( DiffuseContribution * nodeVar218 );
	nodeVar220 = ( nodeVar219 * nodeVar212 );
	nodeVar221 = nodeVar220;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar222 = ( indirectSpecular + nodeVar215 );
	indirectSpecular = nodeVar222;
	nodeVar223 = ( indirectDiffuse + nodeVar221 );
	indirectDiffuse = nodeVar223;
	ambientOcclusion = 1.0;
	nodeVar224 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar224;
	nodeVar225 = dot( normalView, positionViewDirection );
	nodeVar226 = ( clamp( nodeVar225, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar227 = ( Roughness * -16.0 );
	nodeVar228 = ( 1.0 - nodeVar227 );
	nodeVar229 = nodeVar228;
	nodeVar230 = ( - nodeVar229 );
	nodeVar231 = exp2( nodeVar230 );
	nodeVar232 = pow( nodeVar226, nodeVar231 );
	nodeVar233 = ( 1.0 - nodeVar232 );
	nodeVar234 = nodeVar233;
	nodeVar235 = ( ambientOcclusion - nodeVar234 );
	nodeVar236 = ( indirectSpecular * vec3<f32>( clamp( nodeVar235, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar236;
	nodeVar237 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar237;
	nodeVar238 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar238;
	nodeVar239 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar239;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar240 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar241 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform44, object.nodeUniform45, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform46 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform47 * object.nodeUniform47 ) * nodeVar240 ) * nodeVar240 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar241;

	// result

	output.color = nodeVar241;

	return output;

}
