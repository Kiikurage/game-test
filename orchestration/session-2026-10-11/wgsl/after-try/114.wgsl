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
var<private> nodeVar9 : f32;
var<private> nodeVar10 : vec3<f32>;
var<private> nodeVar11 : f32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar12 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar13 : vec3<f32>;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : f32;
var<private> NORMAL_normalView : vec3<f32>;
var<private> nodeVar17 : vec3<f32>;
var<private> nodeVar18 : vec2<f32>;
var<private> nodeVar19 : vec3<f32>;
var<private> nodeVar20 : vec2<f32>;
var<private> nodeVar21 : vec3<f32>;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : vec3<f32>;
var<private> nodeVar24 : f32;
var<private> tangentViewFrame : vec3<f32>;
var<private> NORMAL_tangentView : vec3<f32>;
var<private> bitangentViewFrame : vec3<f32>;
var<private> NORMAL_bitangentView : vec3<f32>;
var<private> NORMAL_TBNViewMatrix : mat3x3<f32>;
var<private> nodeVar25 : vec4<f32>;
var<private> nodeVar26 : vec4<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : vec3<f32>;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : vec2<f32>;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : vec3<f32>;
var<private> nodeVar39 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar40 : f32;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : vec3<f32>;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : vec3<f32>;
var<private> nodeVar46 : vec4<f32>;
var<private> nodeVar47 : vec4<f32>;
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : f32;
var<private> nodeVar58 : f32;
var<private> nodeVar59 : f32;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> nodeVar74 : vec4<f32>;
var<private> nodeVar75 : vec4<f32>;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : vec4<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : f32;
var<private> nodeVar85 : vec2<f32>;
var<private> nodeVar86 : f32;
var<private> nodeVar87 : vec2<f32>;
var<private> nodeVar88 : f32;
var<private> nodeVar89 : vec2<f32>;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : vec2<f32>;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : vec2<f32>;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : f32;
var<private> nodeVar104 : f32;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : f32;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : f32;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : f32;
var<private> nodeVar124 : f32;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : f32;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : f32;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : f32;
var<private> nodeVar142 : f32;
var<private> nodeVar143 : f32;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : f32;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : f32;
var<private> nodeVar160 : f32;
var<private> nodeVar161 : f32;
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
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : f32;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : f32;
var<private> nodeVar186 : f32;
var<private> nodeVar187 : f32;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : f32;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : f32;
var<private> nodeVar204 : f32;
var<private> nodeVar205 : f32;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : f32;
var<private> nodeVar229 : f32;
var<private> nodeVar230 : f32;
var<private> nodeVar231 : f32;
var<private> nodeVar232 : f32;
var<private> nodeVar233 : f32;
var<private> nodeVar234 : f32;
var<private> nodeVar235 : f32;
var<private> nodeVar236 : f32;
var<private> nodeVar237 : f32;
var<private> nodeVar238 : f32;
var<private> nodeVar239 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar242 : vec3<f32>;
var<private> nodeVar243 : f32;
var<private> nodeVar244 : vec4<f32>;

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
fn main( @location( 0 ) positionLocal : vec3<f32>,
	@location( 1 ) v_positionView : vec3<f32>,
	@location( 2 ) v_positionWorld : vec3<f32>,
	@location( 3 ) v_normalViewGeometry : vec3<f32>,
	@location( 4 ) v_positionViewDirection : vec3<f32>,
	@location( 5 ) nodeVarying7 : vec2<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar1 = textureSample( nodeUniform3, nodeUniform3_sampler, ( object.nodeUniform4 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	nodeVar2 = dot( ( nodeVar1.xyz * vec3<f32>( 0.78, 0.85, 1.0 ) ), vec3<f32>( 0.2126, 0.7152, 0.0722 ) );
	nodeVar3 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( vec3<f32>( ( nodeVarying7 * vec2<f32>( 11.0 ) ), 0.37 ) + vec3<f32>( 3.7 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar4 = smoothstep( -0.25, 0.35, nodeVar3 );
	nodeVar5 = mix( -0.11, 1.01, object.nodeUniform6 );
	nodeVar6 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( v_positionWorld * vec3<f32>( 4.2 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar7 = clamp( ( ( nodeVar6 * 0.9 ) + 0.5 ), 0.0, 1.0 );
	nodeVar8 = ( 1.0 - smoothstep( nodeVar5, ( nodeVar5 + 0.1 ), nodeVar7 ) );
	nodeVar9 = ( nodeVar8 * nodeVar8 );
	nodeVar10 = mix( mix( ( vec3<f32>( 0.17, 0.16, 0.15 ) * vec3<f32>( ( ( nodeVar2 * 0.8 ) + 0.5 ) ) ), ( vec3<f32>( 0.19461783043107173, 0.06847816983662762, 0.023153366173251363 ) * vec3<f32>( ( ( nodeVar2 * 0.9 ) + 0.35 ) ) ), nodeVar4 ), vec3<f32>( 0.007499032040460618, 0.005605391621829108, 0.004776953478513362 ), ( nodeVar9 * 0.9 ) );
	DiffuseColor = vec4<f32>( nodeVar10, 1.0 );

	if ( ( nodeVar7 > nodeVar5 ) ) {

		nodeVar11 = 1.0;

	} else {

		nodeVar11 = 0.0;

	}

	DiffuseColor.w = ( DiffuseColor.w * nodeVar11 );

	if ( ( DiffuseColor.w <= object.nodeUniform8 ) ) {

		discard;
		

	}

	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform9;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar12 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform10, 0.0525 ) + max( max( nodeVar12.x, nodeVar12.y ), nodeVar12.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform9 ) ) );
	nodeVar13 = ( positionLocal * vec3<f32>( 14.0 ) );
	nodeVar14 = textureSample( nodeUniform5, nodeUniform5_sampler, ( nodeVar13 / vec3<f32>( 8.0 ) ) ).x;
	nodeVar15 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( ( nodeVar13 * vec3<f32>( 0.23 ) ) + vec3<f32>( 7.3 ) ) / vec3<f32>( 8.0 ) ) ).x;

	if ( ( object.nodeUniform6 > 0.0 ) ) {

		nodeVar16 = 3.2;

	} else {

		nodeVar16 = 0.0;

	}

	NORMAL_normalView = normalViewGeometry;
	nodeVar17 = cross( - dpdy( v_positionView ), NORMAL_normalView );
	nodeVar18 = dpdx( nodeVarying7 );
	nodeVar19 = cross( NORMAL_normalView, dpdx( v_positionView ) );
	nodeVar20 = - dpdy( nodeVarying7 );
	nodeVar21 = ( ( nodeVar17 * vec3<f32>( nodeVar18.x ) ) + ( nodeVar19 * vec3<f32>( nodeVar20.x ) ) );
	nodeVar23 = ( ( nodeVar17 * vec3<f32>( nodeVar18.y ) ) + ( nodeVar19 * vec3<f32>( nodeVar20.y ) ) );
	nodeVar24 = max( dot( nodeVar21, nodeVar21 ), dot( nodeVar23, nodeVar23 ) );

	if ( ( nodeVar24 == 0.0 ) ) {

		nodeVar22 = 0.0;

	} else {

		nodeVar22 = inverseSqrt( nodeVar24 );

	}

	tangentViewFrame = ( nodeVar21 * vec3<f32>( nodeVar22 ) );
	NORMAL_tangentView = tangentViewFrame;
	bitangentViewFrame = ( nodeVar23 * nodeVar22 );
	NORMAL_bitangentView = bitangentViewFrame;
	NORMAL_TBNViewMatrix = mat3x3<f32>( NORMAL_tangentView, NORMAL_bitangentView, NORMAL_normalView );
	nodeVar25 = textureSample( nodeUniform15, nodeUniform15_sampler, ( object.nodeUniform16 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	nodeVar26 = ( ( nodeVar25 * vec4<f32>( 2.0 ) ) - vec4<f32>( 1.0 ) );
	normalView = normalize( ( NORMAL_TBNViewMatrix * vec3<f32>( ( nodeVar26.xy * object.nodeUniform17 ), nodeVar26.z ) ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar27 = normalize( normalWorld );
	nodeVar28 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar29 = pow( ( 1.0 - clamp( dot( nodeVar27, nodeVar28 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar30 = smoothstep( -0.35, 0.55, dot( nodeVar27, object.nodeUniform20 ) );
	nodeVar31 = smoothstep( -0.15, 0.85, ( - dot( nodeVar28, object.nodeUniform20 ) ) );
	EmissiveColor = ( ( ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( object.nodeUniform13 ) ) * vec3<f32>( ( ( ( ( ( 1.0 - smoothstep( 0.0, 0.032, abs( nodeVar14 ) ) ) * smoothstep( 0.05, 0.5, nodeVar15 ) ) * 1.1 ) + 0.0 ) + ( ( 1.0 - nodeVar4 ) * 0.03 ) ) ) ) + ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( smoothstep( 0.35, 1.0, nodeVar8 ) ) ) * vec3<f32>( nodeVar16 ) ) ) + ( mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( object.nodeUniform14 * vec3<f32>( nodeVar29 ) ) * vec3<f32>( nodeVar30 ) ) * vec3<f32>( ( ( nodeVar31 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform21 * vec3<f32>( nodeVar29 ) ) * vec3<f32>( ( 1.0 - ( nodeVar30 * nodeVar31 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( ( nodeVar10 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar10, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform22 ) * vec3<f32>( ( 1.0 - nodeVar9 ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar32 = dot( normalView, positionViewDirection );
	nodeVar33 = textureSample( nodeUniform23, nodeUniform23_sampler, vec2<f32>( Roughness, clamp( nodeVar32, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar33;
	nodeVar34 = ( dfg.x + dfg.y );
	nodeVar35 = ( 1.0 / nodeVar34 );
	nodeVar36 = nodeVar35;
	nodeVar37 = ( nodeVar36 - 1.0 );
	nodeVar38 = ( SpecularColorBlended * vec3<f32>( nodeVar37 ) );
	nodeVar39 = ( nodeVar38 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar39;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar40 = dot( normalWorld, normalize( render.nodeUniform26 ) );
	nodeVar41 = ( nodeVar40 * 0.5 );
	nodeVar42 = ( nodeVar41 + 0.5 );
	nodeVar43 = mix( render.nodeUniform24, render.nodeUniform25, nodeVar42 );
	nodeVar44 = ( irradiance + nodeVar43 );
	irradiance = nodeVar44;
	nodeVar45 = ( render.nodeUniform27 - render.nodeUniform28 );
	nodeVar46 = vec4<f32>( nodeVar45, 0.0 );
	nodeVar47 = ( render.cameraViewMatrix * nodeVar46 );
	nodeVar48 = normalize( nodeVar47.xyz );
	nodeVar49 = nodeVar48;
	nodeVar50 = dot( normalView, nodeVar49 );
	nodeVar51 = ( vec3<f32>( clamp( nodeVar50, 0.0, 1.0 ) ) * render.nodeUniform29 );
	nodeVar52 = nodeVar51;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar53 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar54 = ( nodeVar52 * nodeVar53 );
	nodeVar55 = ( nodeVar49 + positionViewDirection );
	nodeVar56 = normalize( nodeVar55 );
	nodeVar57 = dot( positionViewDirection, nodeVar56 );
	nodeVar58 = clamp( nodeVar57, 0.0, 1.0 );
	nodeVar59 = exp2( ( ( ( nodeVar58 * -5.55473 ) - 6.98316 ) * nodeVar58 ) );
	nodeVar60 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar59 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar59 ) ) );
	nodeVar61 = ( vec3<f32>( 1.0 ) - nodeVar60 );
	nodeVar62 = nodeVar61;
	nodeVar63 = ( nodeVar54 * nodeVar62 );
	nodeVar64 = ( directDiffuse + nodeVar63 );
	directDiffuse = nodeVar64;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar65 = normalize( ( nodeVar49 + positionViewDirection ) );
	nodeVar66 = clamp( dot( positionViewDirection, nodeVar65 ), 0.0, 1.0 );
	nodeVar67 = exp2( ( ( ( nodeVar66 * -5.55473 ) - 6.98316 ) * nodeVar66 ) );
	nodeVar68 = ( Roughness * Roughness );
	nodeVar69 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar67 ) ) ) + vec3<f32>( ( 1.0 * nodeVar67 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar68, clamp( dot( normalView, nodeVar49 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar68, clamp( dot( normalView, nodeVar65 ), 0.0, 1.0 ) ) ) );
	nodeVar70 = ( nodeVar52 * nodeVar69 );
	nodeVar71 = ( nodeVar70 * multiScatteringCompensation );
	nodeVar72 = ( directSpecular + nodeVar71 );
	directSpecular = nodeVar72;
	nodeVar73 = ( render.nodeUniform30 - render.nodeUniform31 );
	nodeVar74 = vec4<f32>( nodeVar73, 0.0 );
	nodeVar75 = ( render.cameraViewMatrix * nodeVar74 );
	nodeVar76 = normalize( nodeVar75.xyz );
	nodeVar77 = nodeVar76;
	nodeVar78 = dot( normalView, nodeVar77 );
	shadowPositionWorld = v_positionWorld;
	nodeVar80 = ( render.nodeUniform33 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform34 ) ) ), 1.0 ) );
	nodeVar81 = ( nodeVar80.xyz / vec3<f32>( nodeVar80.w ) );
	nodeVar82 = vec3<f32>( nodeVar81.x, ( 1.0 - nodeVar81.y ), ( nodeVar81.z + render.nodeUniform35 ) );

	if ( ( ( ( ( ( nodeVar82.x >= 0.0 ) && ( nodeVar82.x <= 1.0 ) ) && ( nodeVar82.y >= 0.0 ) ) && ( nodeVar82.y <= 1.0 ) ) && ( nodeVar82.z <= 1.0 ) ) ) {

		nodeVar83 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar84 = ( render.nodeUniform37 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform38 ).x );
		nodeVar85 = ( nodeVar82.xy + ( vogelDiskSample( 0, 5, nodeVar83 ) * vec2<f32>( nodeVar84 ) ) );
		nodeVar86 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar85, nodeVar82.z );
		nodeVar87 = ( nodeVar82.xy + ( vogelDiskSample( 1, 5, nodeVar83 ) * vec2<f32>( nodeVar84 ) ) );
		nodeVar88 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar87, nodeVar82.z );
		nodeVar89 = ( nodeVar82.xy + ( vogelDiskSample( 2, 5, nodeVar83 ) * vec2<f32>( nodeVar84 ) ) );
		nodeVar90 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar89, nodeVar82.z );
		nodeVar91 = ( nodeVar82.xy + ( vogelDiskSample( 3, 5, nodeVar83 ) * vec2<f32>( nodeVar84 ) ) );
		nodeVar92 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar91, nodeVar82.z );
		nodeVar93 = ( nodeVar82.xy + ( vogelDiskSample( 4, 5, nodeVar83 ) * vec2<f32>( nodeVar84 ) ) );
		nodeVar94 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar93, nodeVar82.z );
		nodeVar79 = ( ( ( ( ( nodeVar86 + nodeVar88 ) + nodeVar90 ) + nodeVar92 ) + nodeVar94 ) * 0.2 );

	} else {

		nodeVar79 = 1.0;

	}

	nodeVar95 = mix( 1.0, nodeVar79, render.nodeUniform39 );
	nodeVar96 = ( vec3<f32>( clamp( nodeVar78, 0.0, 1.0 ) ) * ( render.nodeUniform32 * vec3<f32>( nodeVar95 ) ) );
	nodeVar97 = nodeVar96;
	nodeVar98 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar99 = ( nodeVar97 * nodeVar98 );
	nodeVar100 = ( nodeVar77 + positionViewDirection );
	nodeVar101 = normalize( nodeVar100 );
	nodeVar102 = dot( positionViewDirection, nodeVar101 );
	nodeVar103 = clamp( nodeVar102, 0.0, 1.0 );
	nodeVar104 = exp2( ( ( ( nodeVar103 * -5.55473 ) - 6.98316 ) * nodeVar103 ) );
	nodeVar105 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar104 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar104 ) ) );
	nodeVar106 = ( vec3<f32>( 1.0 ) - nodeVar105 );
	nodeVar107 = nodeVar106;
	nodeVar108 = ( nodeVar99 * nodeVar107 );
	nodeVar109 = ( directDiffuse + nodeVar108 );
	directDiffuse = nodeVar109;
	nodeVar110 = normalize( ( nodeVar77 + positionViewDirection ) );
	nodeVar111 = clamp( dot( positionViewDirection, nodeVar110 ), 0.0, 1.0 );
	nodeVar112 = exp2( ( ( ( nodeVar111 * -5.55473 ) - 6.98316 ) * nodeVar111 ) );
	nodeVar113 = ( Roughness * Roughness );
	nodeVar114 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar112 ) ) ) + vec3<f32>( ( 1.0 * nodeVar112 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar113, clamp( dot( normalView, nodeVar77 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar113, clamp( dot( normalView, nodeVar110 ), 0.0, 1.0 ) ) ) );
	nodeVar115 = ( nodeVar97 * nodeVar114 );
	nodeVar116 = ( nodeVar115 * multiScatteringCompensation );
	nodeVar117 = ( directSpecular + nodeVar116 );
	directSpecular = nodeVar117;
	nodeVar118 = ( render.nodeUniform40 - v_positionView );
	nodeVar119 = normalize( nodeVar118 );
	nodeVar120 = dot( normalView, nodeVar119 );

	if ( ( render.nodeUniform42 > 0.0 ) ) {

		nodeVar122 = length( nodeVar118 );
		nodeVar123 = ( nodeVar122 / render.nodeUniform42 );
		nodeVar124 = clamp( ( 1.0 - ( ( ( nodeVar123 * nodeVar123 ) * nodeVar123 ) * nodeVar123 ) ), 0.0, 1.0 );
		nodeVar121 = ( ( 1.0 / max( pow( nodeVar122, render.nodeUniform43 ), 0.01 ) ) * ( nodeVar124 * nodeVar124 ) );

	} else {

		nodeVar121 = ( 1.0 / max( pow( length( nodeVar118 ), render.nodeUniform43 ), 0.01 ) );

	}

	nodeVar125 = ( render.nodeUniform41 * vec3<f32>( nodeVar121 ) );
	nodeVar126 = ( vec3<f32>( clamp( nodeVar120, 0.0, 1.0 ) ) * nodeVar125 );
	nodeVar127 = nodeVar126;
	nodeVar128 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar129 = ( nodeVar127 * nodeVar128 );
	nodeVar130 = ( nodeVar119 + positionViewDirection );
	nodeVar131 = normalize( nodeVar130 );
	nodeVar132 = dot( positionViewDirection, nodeVar131 );
	nodeVar133 = clamp( nodeVar132, 0.0, 1.0 );
	nodeVar134 = exp2( ( ( ( nodeVar133 * -5.55473 ) - 6.98316 ) * nodeVar133 ) );
	nodeVar135 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar134 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar134 ) ) );
	nodeVar136 = ( vec3<f32>( 1.0 ) - nodeVar135 );
	nodeVar137 = nodeVar136;
	nodeVar138 = ( nodeVar129 * nodeVar137 );
	nodeVar139 = ( directDiffuse + nodeVar138 );
	directDiffuse = nodeVar139;
	nodeVar140 = normalize( ( nodeVar119 + positionViewDirection ) );
	nodeVar141 = clamp( dot( positionViewDirection, nodeVar140 ), 0.0, 1.0 );
	nodeVar142 = exp2( ( ( ( nodeVar141 * -5.55473 ) - 6.98316 ) * nodeVar141 ) );
	nodeVar143 = ( Roughness * Roughness );
	nodeVar144 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar142 ) ) ) + vec3<f32>( ( 1.0 * nodeVar142 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar143, clamp( dot( normalView, nodeVar119 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar143, clamp( dot( normalView, nodeVar140 ), 0.0, 1.0 ) ) ) );
	nodeVar145 = ( nodeVar127 * nodeVar144 );
	nodeVar146 = ( nodeVar145 * multiScatteringCompensation );
	nodeVar147 = ( directSpecular + nodeVar146 );
	directSpecular = nodeVar147;
	nodeVar148 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar149 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar150 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar151 = ( SpecularF90 * dfg.y );
	nodeVar152 = ( nodeVar150 + vec3<f32>( nodeVar151 ) );
	nodeVar153 = ( nodeVar148 + nodeVar152 );
	nodeVar148 = nodeVar153;
	nodeVar154 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar155 = nodeVar154;
	nodeVar156 = ( nodeVar155 * vec3<f32>( 0.047619 ) );
	nodeVar157 = ( SpecularColor + nodeVar156 );
	nodeVar158 = ( nodeVar152 * nodeVar157 );
	nodeVar159 = ( dfg.x + dfg.y );
	nodeVar160 = ( 1.0 - nodeVar159 );
	nodeVar161 = nodeVar160;
	nodeVar162 = ( vec3<f32>( nodeVar161 ) * nodeVar157 );
	nodeVar163 = ( vec3<f32>( 1.0 ) - nodeVar162 );
	nodeVar164 = nodeVar163;
	nodeVar165 = ( nodeVar158 / nodeVar164 );
	nodeVar166 = ( nodeVar165 * vec3<f32>( nodeVar161 ) );
	nodeVar167 = ( nodeVar149 + nodeVar166 );
	nodeVar149 = nodeVar167;
	nodeVar168 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar169 = ( irradiance * nodeVar168 );
	nodeVar170 = ( nodeVar148 + nodeVar149 );
	nodeVar171 = ( vec3<f32>( 1.0 ) - nodeVar170 );
	nodeVar172 = nodeVar171;
	nodeVar173 = ( nodeVar169 * nodeVar172 );
	nodeVar174 = nodeVar173;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar175 = ( indirectDiffuse + nodeVar174 );
	indirectDiffuse = nodeVar175;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar176 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar177 = ( SpecularF90 * dfg.y );
	nodeVar178 = ( nodeVar176 + vec3<f32>( nodeVar177 ) );
	nodeVar179 = ( singleScatteringDielectric + nodeVar178 );
	singleScatteringDielectric = nodeVar179;
	nodeVar180 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar181 = nodeVar180;
	nodeVar182 = ( nodeVar181 * vec3<f32>( 0.047619 ) );
	nodeVar183 = ( SpecularColor + nodeVar182 );
	nodeVar184 = ( nodeVar178 * nodeVar183 );
	nodeVar185 = ( dfg.x + dfg.y );
	nodeVar186 = ( 1.0 - nodeVar185 );
	nodeVar187 = nodeVar186;
	nodeVar188 = ( vec3<f32>( nodeVar187 ) * nodeVar183 );
	nodeVar189 = ( vec3<f32>( 1.0 ) - nodeVar188 );
	nodeVar190 = nodeVar189;
	nodeVar191 = ( nodeVar184 / nodeVar190 );
	nodeVar192 = ( nodeVar191 * vec3<f32>( nodeVar187 ) );
	nodeVar193 = ( multiScatteringDielectric + nodeVar192 );
	multiScatteringDielectric = nodeVar193;
	nodeVar194 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar195 = ( SpecularF90 * dfg.y );
	nodeVar196 = ( nodeVar194 + vec3<f32>( nodeVar195 ) );
	nodeVar197 = ( singleScatteringMetallic + nodeVar196 );
	singleScatteringMetallic = nodeVar197;
	nodeVar198 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar199 = nodeVar198;
	nodeVar200 = ( nodeVar199 * vec3<f32>( 0.047619 ) );
	nodeVar201 = ( DiffuseColor.xyz + nodeVar200 );
	nodeVar202 = ( nodeVar196 * nodeVar201 );
	nodeVar203 = ( dfg.x + dfg.y );
	nodeVar204 = ( 1.0 - nodeVar203 );
	nodeVar205 = nodeVar204;
	nodeVar206 = ( vec3<f32>( nodeVar205 ) * nodeVar201 );
	nodeVar207 = ( vec3<f32>( 1.0 ) - nodeVar206 );
	nodeVar208 = nodeVar207;
	nodeVar209 = ( nodeVar202 / nodeVar208 );
	nodeVar210 = ( nodeVar209 * vec3<f32>( nodeVar205 ) );
	nodeVar211 = ( multiScatteringMetallic + nodeVar210 );
	multiScatteringMetallic = nodeVar211;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar212 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar213 = ( radiance * nodeVar212 );
	nodeVar214 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar215 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar216 = ( nodeVar214 * nodeVar215 );
	nodeVar217 = ( nodeVar213 + nodeVar216 );
	nodeVar218 = nodeVar217;
	nodeVar219 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar220 = ( vec3<f32>( 1.0 ) - nodeVar219 );
	nodeVar221 = nodeVar220;
	nodeVar222 = ( DiffuseContribution * nodeVar221 );
	nodeVar223 = ( nodeVar222 * nodeVar215 );
	nodeVar224 = nodeVar223;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar225 = ( indirectSpecular + nodeVar218 );
	indirectSpecular = nodeVar225;
	nodeVar226 = ( indirectDiffuse + nodeVar224 );
	indirectDiffuse = nodeVar226;
	ambientOcclusion = 1.0;
	nodeVar227 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar227;
	nodeVar228 = dot( normalView, positionViewDirection );
	nodeVar229 = ( clamp( nodeVar228, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar230 = ( Roughness * -16.0 );
	nodeVar231 = ( 1.0 - nodeVar230 );
	nodeVar232 = nodeVar231;
	nodeVar233 = ( - nodeVar232 );
	nodeVar234 = exp2( nodeVar233 );
	nodeVar235 = pow( nodeVar229, nodeVar234 );
	nodeVar236 = ( 1.0 - nodeVar235 );
	nodeVar237 = nodeVar236;
	nodeVar238 = ( ambientOcclusion - nodeVar237 );
	nodeVar239 = ( indirectSpecular * vec3<f32>( clamp( nodeVar238, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar239;
	nodeVar240 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar240;
	nodeVar241 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar241;
	nodeVar242 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar242;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar243 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar244 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform44, object.nodeUniform45, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform46 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform47 * object.nodeUniform47 ) * nodeVar243 ) * nodeVar243 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar244;

	// result

	output.color = nodeVar244;

	return output;

}
