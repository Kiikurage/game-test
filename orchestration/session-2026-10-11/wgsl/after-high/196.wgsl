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
@binding( 4 ) @group( 1 ) var nodeUniform5 : texture_2d<f32>;
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
var<private> nodeVar3 : vec3<f32>;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : vec2<f32>;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : vec3<f32>;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : vec2<f32>;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : vec3<f32>;
var<private> nodeVar16 : f32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar17 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar18 : vec3<f32>;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : vec2<f32>;
var<private> nodeVar22 : f32;
var<private> NORMAL_normalView : vec3<f32>;
var<private> nodeVar23 : vec3<f32>;
var<private> nodeVar24 : vec2<f32>;
var<private> nodeVar25 : vec3<f32>;
var<private> nodeVar26 : vec2<f32>;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : vec3<f32>;
var<private> nodeVar30 : f32;
var<private> tangentViewFrame : vec3<f32>;
var<private> NORMAL_tangentView : vec3<f32>;
var<private> bitangentViewFrame : vec3<f32>;
var<private> NORMAL_bitangentView : vec3<f32>;
var<private> NORMAL_TBNViewMatrix : mat3x3<f32>;
var<private> nodeVar31 : vec4<f32>;
var<private> nodeVar32 : vec4<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar33 : vec3<f32>;
var<private> nodeVar34 : vec3<f32>;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : vec2<f32>;
var<private> nodeVar40 : f32;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : vec4<f32>;
var<private> nodeVar53 : vec4<f32>;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : f32;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : f32;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : vec3<f32>;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec4<f32>;
var<private> nodeVar81 : vec4<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : vec4<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : f32;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : vec2<f32>;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : vec2<f32>;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : vec2<f32>;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : vec2<f32>;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : vec2<f32>;
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
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : f32;
var<private> nodeVar127 : f32;
var<private> nodeVar128 : f32;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : f32;
var<private> nodeVar131 : vec3<f32>;
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
var<private> nodeVar147 : f32;
var<private> nodeVar148 : f32;
var<private> nodeVar149 : f32;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : f32;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : f32;
var<private> nodeVar166 : f32;
var<private> nodeVar167 : f32;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : f32;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : f32;
var<private> nodeVar192 : f32;
var<private> nodeVar193 : f32;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : f32;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : f32;
var<private> nodeVar210 : f32;
var<private> nodeVar211 : f32;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar233 : vec3<f32>;
var<private> nodeVar234 : f32;
var<private> nodeVar235 : f32;
var<private> nodeVar236 : f32;
var<private> nodeVar237 : f32;
var<private> nodeVar238 : f32;
var<private> nodeVar239 : f32;
var<private> nodeVar240 : f32;
var<private> nodeVar241 : f32;
var<private> nodeVar242 : f32;
var<private> nodeVar243 : f32;
var<private> nodeVar244 : f32;
var<private> nodeVar245 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar246 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar247 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> nodeVar249 : f32;
var<private> nodeVar250 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }
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
	nodeVar3 = fract( ( vec3<f32>( ( nodeVarying7 * vec2<f32>( 9.0 ) ), 0.37 ) / vec3<f32>( 8.0 ) ) );
	nodeVar4 = ( nodeVar3.z * 64.0 );
	nodeVar5 = floor( nodeVar4 );
	nodeVar6 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar5, 8.0 ), floor( ( nodeVar5 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar3.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar7 = mix( -0.11, 1.01, object.nodeUniform6 );
	nodeVar8 = fract( ( ( v_positionWorld * vec3<f32>( 4.2 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar9 = ( nodeVar8.z * 64.0 );
	nodeVar10 = floor( nodeVar9 );
	nodeVar11 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar10, 8.0 ), floor( ( nodeVar10 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar8.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar12 = clamp( ( ( mix( nodeVar11.x, nodeVar11.y, ( nodeVar9 - nodeVar10 ) ) * 0.9 ) + 0.5 ), 0.0, 1.0 );
	nodeVar13 = ( 1.0 - smoothstep( nodeVar7, ( nodeVar7 + 0.1 ), nodeVar12 ) );
	nodeVar14 = ( nodeVar13 * nodeVar13 );
	nodeVar15 = mix( mix( ( ( vec3<f32>( 0.06847816983662762, 0.04970656597728775, 0.04231141061442144 ) * vec3<f32>( ( ( nodeVar2 * 1.6 ) + 0.45 ) ) ) * vec3<f32>( 3.4 ) ), ( ( vec3<f32>( 0.01764195448412081, 0.014443843592229466, 0.013702083043526807 ) * vec3<f32>( ( nodeVar2 + 0.4 ) ) ) * vec3<f32>( 3.4 ) ), ( smoothstep( -0.35, 0.6, mix( nodeVar6.x, nodeVar6.y, ( nodeVar4 - nodeVar5 ) ) ) * 0.5 ) ), vec3<f32>( 0.007499032040460618, 0.005605391621829108, 0.004776953478513362 ), ( nodeVar14 * 0.9 ) );
	DiffuseColor = vec4<f32>( nodeVar15, 1.0 );

	if ( ( nodeVar12 > nodeVar7 ) ) {

		nodeVar16 = 1.0;

	} else {

		nodeVar16 = 0.0;

	}

	DiffuseColor.w = ( DiffuseColor.w * nodeVar16 );

	if ( ( DiffuseColor.w <= object.nodeUniform8 ) ) {

		discard;
		

	}

	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform9;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar17 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform10, 0.0525 ) + max( max( nodeVar17.x, nodeVar17.y ), nodeVar17.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform9 ) ) );
	nodeVar18 = fract( ( vec3<f32>( ( nodeVarying7 * vec2<f32>( 30.0 ) ), 0.37 ) / vec3<f32>( 8.0 ) ) );
	nodeVar19 = ( nodeVar18.z * 64.0 );
	nodeVar20 = floor( nodeVar19 );
	nodeVar21 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar20, 8.0 ), floor( ( nodeVar20 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar18.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;

	if ( ( object.nodeUniform6 > 0.0 ) ) {

		nodeVar22 = 3.2;

	} else {

		nodeVar22 = 0.0;

	}

	NORMAL_normalView = normalViewGeometry;
	nodeVar23 = cross( - dpdy( v_positionView ), NORMAL_normalView );
	nodeVar24 = dpdx( nodeVarying7 );
	nodeVar25 = cross( NORMAL_normalView, dpdx( v_positionView ) );
	nodeVar26 = - dpdy( nodeVarying7 );
	nodeVar27 = ( ( nodeVar23 * vec3<f32>( nodeVar24.x ) ) + ( nodeVar25 * vec3<f32>( nodeVar26.x ) ) );
	nodeVar29 = ( ( nodeVar23 * vec3<f32>( nodeVar24.y ) ) + ( nodeVar25 * vec3<f32>( nodeVar26.y ) ) );
	nodeVar30 = max( dot( nodeVar27, nodeVar27 ), dot( nodeVar29, nodeVar29 ) );

	if ( ( nodeVar30 == 0.0 ) ) {

		nodeVar28 = 0.0;

	} else {

		nodeVar28 = inverseSqrt( nodeVar30 );

	}

	tangentViewFrame = ( nodeVar27 * vec3<f32>( nodeVar28 ) );
	NORMAL_tangentView = tangentViewFrame;
	bitangentViewFrame = ( nodeVar29 * nodeVar28 );
	NORMAL_bitangentView = bitangentViewFrame;
	NORMAL_TBNViewMatrix = mat3x3<f32>( NORMAL_tangentView, NORMAL_bitangentView, NORMAL_normalView );
	nodeVar31 = textureSample( nodeUniform15, nodeUniform15_sampler, ( object.nodeUniform16 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	nodeVar32 = ( ( nodeVar31 * vec4<f32>( 2.0 ) ) - vec4<f32>( 1.0 ) );
	normalView = normalize( ( NORMAL_TBNViewMatrix * vec3<f32>( ( nodeVar32.xy * object.nodeUniform17 ), nodeVar32.z ) ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar33 = normalize( normalWorld );
	nodeVar34 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar35 = pow( ( 1.0 - clamp( dot( nodeVar33, nodeVar34 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar36 = smoothstep( -0.35, 0.55, dot( nodeVar33, object.nodeUniform20 ) );
	nodeVar37 = smoothstep( -0.15, 0.85, ( - dot( nodeVar34, object.nodeUniform20 ) ) );
	EmissiveColor = ( ( ( ( ( ( mix( vec3<f32>( 0.34670405634441115, 0.6866853124288864, 1.0 ), vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ), object.nodeUniform13 ) * vec3<f32>( clamp( ( ( 0.0 + ( 1.0 - smoothstep( 0.0043749999999999995, 0.0125, length( ( nodeVarying7 - vec2<f32>( 0.139, 0.252 ) ) ) ) ) ) + ( 1.0 - smoothstep( 0.0043749999999999995, 0.0125, length( ( nodeVarying7 - vec2<f32>( 0.231, 0.252 ) ) ) ) ) ), 0.0, 1.0 ) ) ) * vec3<f32>( 0.0 ) ) * vec3<f32>( 1.8399999999999999 ) ) + ( ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( object.nodeUniform13 ) ) * vec3<f32>( ( 1.0 - smoothstep( 0.0, 0.035, abs( mix( nodeVar21.x, nodeVar21.y, ( nodeVar19 - nodeVar20 ) ) ) ) ) ) ) * vec3<f32>( 0.6 ) ) ) + ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( smoothstep( 0.35, 1.0, nodeVar13 ) ) ) * vec3<f32>( nodeVar22 ) ) ) + ( mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( object.nodeUniform14 * vec3<f32>( nodeVar35 ) ) * vec3<f32>( nodeVar36 ) ) * vec3<f32>( ( ( nodeVar37 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform21 * vec3<f32>( nodeVar35 ) ) * vec3<f32>( ( 1.0 - ( nodeVar36 * nodeVar37 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( ( nodeVar15 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar15, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform22 ) * vec3<f32>( ( 1.0 - nodeVar14 ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar38 = dot( normalView, positionViewDirection );
	nodeVar39 = textureSample( nodeUniform23, nodeUniform23_sampler, vec2<f32>( Roughness, clamp( nodeVar38, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar39;
	nodeVar40 = ( dfg.x + dfg.y );
	nodeVar41 = ( 1.0 / nodeVar40 );
	nodeVar42 = nodeVar41;
	nodeVar43 = ( nodeVar42 - 1.0 );
	nodeVar44 = ( SpecularColorBlended * vec3<f32>( nodeVar43 ) );
	nodeVar45 = ( nodeVar44 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar45;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar46 = dot( normalWorld, normalize( render.nodeUniform26 ) );
	nodeVar47 = ( nodeVar46 * 0.5 );
	nodeVar48 = ( nodeVar47 + 0.5 );
	nodeVar49 = mix( render.nodeUniform24, render.nodeUniform25, nodeVar48 );
	nodeVar50 = ( irradiance + nodeVar49 );
	irradiance = nodeVar50;
	nodeVar51 = ( render.nodeUniform27 - render.nodeUniform28 );
	nodeVar52 = vec4<f32>( nodeVar51, 0.0 );
	nodeVar53 = ( render.cameraViewMatrix * nodeVar52 );
	nodeVar54 = normalize( nodeVar53.xyz );
	nodeVar55 = nodeVar54;
	nodeVar56 = dot( normalView, nodeVar55 );
	nodeVar57 = ( vec3<f32>( clamp( nodeVar56, 0.0, 1.0 ) ) * render.nodeUniform29 );
	nodeVar58 = nodeVar57;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar59 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar60 = ( nodeVar58 * nodeVar59 );
	nodeVar61 = ( nodeVar55 + positionViewDirection );
	nodeVar62 = normalize( nodeVar61 );
	nodeVar63 = dot( positionViewDirection, nodeVar62 );
	nodeVar64 = clamp( nodeVar63, 0.0, 1.0 );
	nodeVar65 = exp2( ( ( ( nodeVar64 * -5.55473 ) - 6.98316 ) * nodeVar64 ) );
	nodeVar66 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar65 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar65 ) ) );
	nodeVar67 = ( vec3<f32>( 1.0 ) - nodeVar66 );
	nodeVar68 = nodeVar67;
	nodeVar69 = ( nodeVar60 * nodeVar68 );
	nodeVar70 = ( directDiffuse + nodeVar69 );
	directDiffuse = nodeVar70;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar71 = normalize( ( nodeVar55 + positionViewDirection ) );
	nodeVar72 = clamp( dot( positionViewDirection, nodeVar71 ), 0.0, 1.0 );
	nodeVar73 = exp2( ( ( ( nodeVar72 * -5.55473 ) - 6.98316 ) * nodeVar72 ) );
	nodeVar74 = ( Roughness * Roughness );
	nodeVar75 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar73 ) ) ) + vec3<f32>( ( 1.0 * nodeVar73 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar74, clamp( dot( normalView, nodeVar55 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar74, clamp( dot( normalView, nodeVar71 ), 0.0, 1.0 ) ) ) );
	nodeVar76 = ( nodeVar58 * nodeVar75 );
	nodeVar77 = ( nodeVar76 * multiScatteringCompensation );
	nodeVar78 = ( directSpecular + nodeVar77 );
	directSpecular = nodeVar78;
	nodeVar79 = ( render.nodeUniform30 - render.nodeUniform31 );
	nodeVar80 = vec4<f32>( nodeVar79, 0.0 );
	nodeVar81 = ( render.cameraViewMatrix * nodeVar80 );
	nodeVar82 = normalize( nodeVar81.xyz );
	nodeVar83 = nodeVar82;
	nodeVar84 = dot( normalView, nodeVar83 );
	shadowPositionWorld = v_positionWorld;
	nodeVar86 = ( render.nodeUniform33 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform34 ) ) ), 1.0 ) );
	nodeVar87 = ( nodeVar86.xyz / vec3<f32>( nodeVar86.w ) );
	nodeVar88 = vec3<f32>( nodeVar87.x, ( 1.0 - nodeVar87.y ), ( nodeVar87.z + render.nodeUniform35 ) );

	if ( ( ( ( ( ( nodeVar88.x >= 0.0 ) && ( nodeVar88.x <= 1.0 ) ) && ( nodeVar88.y >= 0.0 ) ) && ( nodeVar88.y <= 1.0 ) ) && ( nodeVar88.z <= 1.0 ) ) ) {

		nodeVar89 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar90 = ( render.nodeUniform37 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform38 ).x );
		nodeVar91 = ( nodeVar88.xy + ( vogelDiskSample( 0, 5, nodeVar89 ) * vec2<f32>( nodeVar90 ) ) );
		nodeVar92 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar91, nodeVar88.z );
		nodeVar93 = ( nodeVar88.xy + ( vogelDiskSample( 1, 5, nodeVar89 ) * vec2<f32>( nodeVar90 ) ) );
		nodeVar94 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar93, nodeVar88.z );
		nodeVar95 = ( nodeVar88.xy + ( vogelDiskSample( 2, 5, nodeVar89 ) * vec2<f32>( nodeVar90 ) ) );
		nodeVar96 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar95, nodeVar88.z );
		nodeVar97 = ( nodeVar88.xy + ( vogelDiskSample( 3, 5, nodeVar89 ) * vec2<f32>( nodeVar90 ) ) );
		nodeVar98 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar97, nodeVar88.z );
		nodeVar99 = ( nodeVar88.xy + ( vogelDiskSample( 4, 5, nodeVar89 ) * vec2<f32>( nodeVar90 ) ) );
		nodeVar100 = textureSampleCompare( nodeUniform36, nodeUniform36_sampler, nodeVar99, nodeVar88.z );
		nodeVar85 = ( ( ( ( ( nodeVar92 + nodeVar94 ) + nodeVar96 ) + nodeVar98 ) + nodeVar100 ) * 0.2 );

	} else {

		nodeVar85 = 1.0;

	}

	nodeVar101 = mix( 1.0, nodeVar85, render.nodeUniform39 );
	nodeVar102 = ( vec3<f32>( clamp( nodeVar84, 0.0, 1.0 ) ) * ( render.nodeUniform32 * vec3<f32>( nodeVar101 ) ) );
	nodeVar103 = nodeVar102;
	nodeVar104 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar105 = ( nodeVar103 * nodeVar104 );
	nodeVar106 = ( nodeVar83 + positionViewDirection );
	nodeVar107 = normalize( nodeVar106 );
	nodeVar108 = dot( positionViewDirection, nodeVar107 );
	nodeVar109 = clamp( nodeVar108, 0.0, 1.0 );
	nodeVar110 = exp2( ( ( ( nodeVar109 * -5.55473 ) - 6.98316 ) * nodeVar109 ) );
	nodeVar111 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar110 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar110 ) ) );
	nodeVar112 = ( vec3<f32>( 1.0 ) - nodeVar111 );
	nodeVar113 = nodeVar112;
	nodeVar114 = ( nodeVar105 * nodeVar113 );
	nodeVar115 = ( directDiffuse + nodeVar114 );
	directDiffuse = nodeVar115;
	nodeVar116 = normalize( ( nodeVar83 + positionViewDirection ) );
	nodeVar117 = clamp( dot( positionViewDirection, nodeVar116 ), 0.0, 1.0 );
	nodeVar118 = exp2( ( ( ( nodeVar117 * -5.55473 ) - 6.98316 ) * nodeVar117 ) );
	nodeVar119 = ( Roughness * Roughness );
	nodeVar120 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar118 ) ) ) + vec3<f32>( ( 1.0 * nodeVar118 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar119, clamp( dot( normalView, nodeVar83 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar119, clamp( dot( normalView, nodeVar116 ), 0.0, 1.0 ) ) ) );
	nodeVar121 = ( nodeVar103 * nodeVar120 );
	nodeVar122 = ( nodeVar121 * multiScatteringCompensation );
	nodeVar123 = ( directSpecular + nodeVar122 );
	directSpecular = nodeVar123;
	nodeVar124 = ( render.nodeUniform40 - v_positionView );
	nodeVar125 = normalize( nodeVar124 );
	nodeVar126 = dot( normalView, nodeVar125 );

	if ( ( render.nodeUniform42 > 0.0 ) ) {

		nodeVar128 = length( nodeVar124 );
		nodeVar129 = ( nodeVar128 / render.nodeUniform42 );
		nodeVar130 = clamp( ( 1.0 - ( ( ( nodeVar129 * nodeVar129 ) * nodeVar129 ) * nodeVar129 ) ), 0.0, 1.0 );
		nodeVar127 = ( ( 1.0 / max( pow( nodeVar128, render.nodeUniform43 ), 0.01 ) ) * ( nodeVar130 * nodeVar130 ) );

	} else {

		nodeVar127 = ( 1.0 / max( pow( length( nodeVar124 ), render.nodeUniform43 ), 0.01 ) );

	}

	nodeVar131 = ( render.nodeUniform41 * vec3<f32>( nodeVar127 ) );
	nodeVar132 = ( vec3<f32>( clamp( nodeVar126, 0.0, 1.0 ) ) * nodeVar131 );
	nodeVar133 = nodeVar132;
	nodeVar134 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar135 = ( nodeVar133 * nodeVar134 );
	nodeVar136 = ( nodeVar125 + positionViewDirection );
	nodeVar137 = normalize( nodeVar136 );
	nodeVar138 = dot( positionViewDirection, nodeVar137 );
	nodeVar139 = clamp( nodeVar138, 0.0, 1.0 );
	nodeVar140 = exp2( ( ( ( nodeVar139 * -5.55473 ) - 6.98316 ) * nodeVar139 ) );
	nodeVar141 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar140 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar140 ) ) );
	nodeVar142 = ( vec3<f32>( 1.0 ) - nodeVar141 );
	nodeVar143 = nodeVar142;
	nodeVar144 = ( nodeVar135 * nodeVar143 );
	nodeVar145 = ( directDiffuse + nodeVar144 );
	directDiffuse = nodeVar145;
	nodeVar146 = normalize( ( nodeVar125 + positionViewDirection ) );
	nodeVar147 = clamp( dot( positionViewDirection, nodeVar146 ), 0.0, 1.0 );
	nodeVar148 = exp2( ( ( ( nodeVar147 * -5.55473 ) - 6.98316 ) * nodeVar147 ) );
	nodeVar149 = ( Roughness * Roughness );
	nodeVar150 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar148 ) ) ) + vec3<f32>( ( 1.0 * nodeVar148 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar149, clamp( dot( normalView, nodeVar125 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar149, clamp( dot( normalView, nodeVar146 ), 0.0, 1.0 ) ) ) );
	nodeVar151 = ( nodeVar133 * nodeVar150 );
	nodeVar152 = ( nodeVar151 * multiScatteringCompensation );
	nodeVar153 = ( directSpecular + nodeVar152 );
	directSpecular = nodeVar153;
	nodeVar154 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar155 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar156 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar157 = ( SpecularF90 * dfg.y );
	nodeVar158 = ( nodeVar156 + vec3<f32>( nodeVar157 ) );
	nodeVar159 = ( nodeVar154 + nodeVar158 );
	nodeVar154 = nodeVar159;
	nodeVar160 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar161 = nodeVar160;
	nodeVar162 = ( nodeVar161 * vec3<f32>( 0.047619 ) );
	nodeVar163 = ( SpecularColor + nodeVar162 );
	nodeVar164 = ( nodeVar158 * nodeVar163 );
	nodeVar165 = ( dfg.x + dfg.y );
	nodeVar166 = ( 1.0 - nodeVar165 );
	nodeVar167 = nodeVar166;
	nodeVar168 = ( vec3<f32>( nodeVar167 ) * nodeVar163 );
	nodeVar169 = ( vec3<f32>( 1.0 ) - nodeVar168 );
	nodeVar170 = nodeVar169;
	nodeVar171 = ( nodeVar164 / nodeVar170 );
	nodeVar172 = ( nodeVar171 * vec3<f32>( nodeVar167 ) );
	nodeVar173 = ( nodeVar155 + nodeVar172 );
	nodeVar155 = nodeVar173;
	nodeVar174 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar175 = ( irradiance * nodeVar174 );
	nodeVar176 = ( nodeVar154 + nodeVar155 );
	nodeVar177 = ( vec3<f32>( 1.0 ) - nodeVar176 );
	nodeVar178 = nodeVar177;
	nodeVar179 = ( nodeVar175 * nodeVar178 );
	nodeVar180 = nodeVar179;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar181 = ( indirectDiffuse + nodeVar180 );
	indirectDiffuse = nodeVar181;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar182 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar183 = ( SpecularF90 * dfg.y );
	nodeVar184 = ( nodeVar182 + vec3<f32>( nodeVar183 ) );
	nodeVar185 = ( singleScatteringDielectric + nodeVar184 );
	singleScatteringDielectric = nodeVar185;
	nodeVar186 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar187 = nodeVar186;
	nodeVar188 = ( nodeVar187 * vec3<f32>( 0.047619 ) );
	nodeVar189 = ( SpecularColor + nodeVar188 );
	nodeVar190 = ( nodeVar184 * nodeVar189 );
	nodeVar191 = ( dfg.x + dfg.y );
	nodeVar192 = ( 1.0 - nodeVar191 );
	nodeVar193 = nodeVar192;
	nodeVar194 = ( vec3<f32>( nodeVar193 ) * nodeVar189 );
	nodeVar195 = ( vec3<f32>( 1.0 ) - nodeVar194 );
	nodeVar196 = nodeVar195;
	nodeVar197 = ( nodeVar190 / nodeVar196 );
	nodeVar198 = ( nodeVar197 * vec3<f32>( nodeVar193 ) );
	nodeVar199 = ( multiScatteringDielectric + nodeVar198 );
	multiScatteringDielectric = nodeVar199;
	nodeVar200 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar201 = ( SpecularF90 * dfg.y );
	nodeVar202 = ( nodeVar200 + vec3<f32>( nodeVar201 ) );
	nodeVar203 = ( singleScatteringMetallic + nodeVar202 );
	singleScatteringMetallic = nodeVar203;
	nodeVar204 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar205 = nodeVar204;
	nodeVar206 = ( nodeVar205 * vec3<f32>( 0.047619 ) );
	nodeVar207 = ( DiffuseColor.xyz + nodeVar206 );
	nodeVar208 = ( nodeVar202 * nodeVar207 );
	nodeVar209 = ( dfg.x + dfg.y );
	nodeVar210 = ( 1.0 - nodeVar209 );
	nodeVar211 = nodeVar210;
	nodeVar212 = ( vec3<f32>( nodeVar211 ) * nodeVar207 );
	nodeVar213 = ( vec3<f32>( 1.0 ) - nodeVar212 );
	nodeVar214 = nodeVar213;
	nodeVar215 = ( nodeVar208 / nodeVar214 );
	nodeVar216 = ( nodeVar215 * vec3<f32>( nodeVar211 ) );
	nodeVar217 = ( multiScatteringMetallic + nodeVar216 );
	multiScatteringMetallic = nodeVar217;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar218 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar219 = ( radiance * nodeVar218 );
	nodeVar220 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar221 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar222 = ( nodeVar220 * nodeVar221 );
	nodeVar223 = ( nodeVar219 + nodeVar222 );
	nodeVar224 = nodeVar223;
	nodeVar225 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar226 = ( vec3<f32>( 1.0 ) - nodeVar225 );
	nodeVar227 = nodeVar226;
	nodeVar228 = ( DiffuseContribution * nodeVar227 );
	nodeVar229 = ( nodeVar228 * nodeVar221 );
	nodeVar230 = nodeVar229;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar231 = ( indirectSpecular + nodeVar224 );
	indirectSpecular = nodeVar231;
	nodeVar232 = ( indirectDiffuse + nodeVar230 );
	indirectDiffuse = nodeVar232;
	ambientOcclusion = 1.0;
	nodeVar233 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar233;
	nodeVar234 = dot( normalView, positionViewDirection );
	nodeVar235 = ( clamp( nodeVar234, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar236 = ( Roughness * -16.0 );
	nodeVar237 = ( 1.0 - nodeVar236 );
	nodeVar238 = nodeVar237;
	nodeVar239 = ( - nodeVar238 );
	nodeVar240 = exp2( nodeVar239 );
	nodeVar241 = pow( nodeVar235, nodeVar240 );
	nodeVar242 = ( 1.0 - nodeVar241 );
	nodeVar243 = nodeVar242;
	nodeVar244 = ( ambientOcclusion - nodeVar243 );
	nodeVar245 = ( indirectSpecular * vec3<f32>( clamp( nodeVar244, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar245;
	nodeVar246 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar246;
	nodeVar247 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar247;
	nodeVar248 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar248;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar249 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar250 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform44, object.nodeUniform45, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform46 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform47 * object.nodeUniform47 ) * nodeVar249 ) * nodeVar249 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar250;

	// result

	output.color = nodeVar250;

	return output;

}
