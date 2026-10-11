// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 1 ) @group( 1 ) var nodeUniform11_sampler : sampler;
@binding( 2 ) @group( 1 ) var nodeUniform11 : texture_2d<f32>;

struct objectStruct {
	nodeUniform0 : mat4x4<f32>,
	nodeUniform2 : mat4x4<f32>,
	nodeUniform3 : vec3<f32>,
	nodeUniform4 : f32,
	nodeUniform5 : f32,
	nodeUniform6 : f32,
	nodeUniform8 : mat3x3<f32>,
	nodeUniform9 : vec3<f32>,
	nodeUniform10 : f32,
	nodeUniform12 : mat4x4<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform31 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform19 : vec3<f32>,
	nodeUniform22 : vec3<f32>,
	nodeUniform24 : vec3<f32>,
	nodeUniform25 : f32,
	nodeUniform26 : f32,
	nodeUniform17 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform20 : vec3<f32>,
	nodeUniform21 : vec3<f32>,
	nodeUniform23 : vec3<f32>,
	cameraPosition : vec3<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar1 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : vec2<f32>;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : vec3<f32>;
var<private> nodeVar9 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : vec3<f32>;
var<private> nodeVar14 : vec3<f32>;
var<private> nodeVar15 : vec3<f32>;
var<private> nodeVar16 : vec4<f32>;
var<private> nodeVar17 : vec4<f32>;
var<private> nodeVar18 : vec3<f32>;
var<private> nodeVar19 : vec3<f32>;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : vec3<f32>;
var<private> nodeVar22 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar23 : vec3<f32>;
var<private> nodeVar24 : vec3<f32>;
var<private> nodeVar25 : vec3<f32>;
var<private> nodeVar26 : vec3<f32>;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : vec3<f32>;
var<private> nodeVar31 : vec3<f32>;
var<private> nodeVar32 : vec3<f32>;
var<private> nodeVar33 : vec3<f32>;
var<private> nodeVar34 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar35 : vec3<f32>;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : vec3<f32>;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : vec3<f32>;
var<private> nodeVar44 : vec4<f32>;
var<private> nodeVar45 : vec4<f32>;
var<private> nodeVar46 : vec3<f32>;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : f32;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : f32;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : f32;
var<private> nodeVar87 : f32;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : vec3<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : f32;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : f32;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
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
var<private> radiance : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
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
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : f32;
var<private> nodeVar182 : f32;
var<private> nodeVar183 : f32;
var<private> nodeVar184 : f32;
var<private> nodeVar185 : f32;
var<private> nodeVar186 : f32;
var<private> nodeVar187 : f32;
var<private> nodeVar188 : f32;
var<private> nodeVar189 : f32;
var<private> nodeVar190 : f32;
var<private> nodeVar191 : f32;
var<private> nodeVar192 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : f32;
var<private> nodeVar197 : vec4<f32>;

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




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_normalViewGeometry : vec3<f32>,
	@location( 2 ) v_positionViewDirection : vec3<f32>,
	@location( 3 ) v_positionWorld : vec3<f32>,
	@location( 4 ) nodeVarying7 : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	DiffuseColor = ( vec4<f32>( object.nodeUniform3, 1.0 ) * nodeVarying7 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform4 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform5;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar1 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform6, 0.0525 ) + max( max( nodeVar1.x, nodeVar1.y ), nodeVar1.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform5 ) ) );
	EmissiveColor = ( object.nodeUniform9 * vec3<f32>( object.nodeUniform10 ) );
	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar2 = dot( normalView, positionViewDirection );
	nodeVar3 = textureSample( nodeUniform11, nodeUniform11_sampler, vec2<f32>( Roughness, clamp( nodeVar2, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar3;
	nodeVar4 = ( dfg.x + dfg.y );
	nodeVar5 = ( 1.0 / nodeVar4 );
	nodeVar6 = nodeVar5;
	nodeVar7 = ( nodeVar6 - 1.0 );
	nodeVar8 = ( SpecularColorBlended * vec3<f32>( nodeVar7 ) );
	nodeVar9 = ( nodeVar8 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar9;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar10 = dot( normalWorld, normalize( render.nodeUniform16 ) );
	nodeVar11 = ( nodeVar10 * 0.5 );
	nodeVar12 = ( nodeVar11 + 0.5 );
	nodeVar13 = mix( render.nodeUniform13, render.nodeUniform14, nodeVar12 );
	nodeVar14 = ( irradiance + nodeVar13 );
	irradiance = nodeVar14;
	nodeVar15 = ( render.nodeUniform17 - render.nodeUniform18 );
	nodeVar16 = vec4<f32>( nodeVar15, 0.0 );
	nodeVar17 = ( render.cameraViewMatrix * nodeVar16 );
	nodeVar18 = normalize( nodeVar17.xyz );
	nodeVar19 = nodeVar18;
	nodeVar20 = dot( normalView, nodeVar19 );
	nodeVar21 = ( vec3<f32>( clamp( nodeVar20, 0.0, 1.0 ) ) * render.nodeUniform19 );
	nodeVar22 = nodeVar21;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar23 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar24 = ( nodeVar22 * nodeVar23 );
	nodeVar25 = ( nodeVar19 + positionViewDirection );
	nodeVar26 = normalize( nodeVar25 );
	nodeVar27 = dot( positionViewDirection, nodeVar26 );
	nodeVar28 = clamp( nodeVar27, 0.0, 1.0 );
	nodeVar29 = exp2( ( ( ( nodeVar28 * -5.55473 ) - 6.98316 ) * nodeVar28 ) );
	nodeVar30 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar29 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar29 ) ) );
	nodeVar31 = ( vec3<f32>( 1.0 ) - nodeVar30 );
	nodeVar32 = nodeVar31;
	nodeVar33 = ( nodeVar24 * nodeVar32 );
	nodeVar34 = ( directDiffuse + nodeVar33 );
	directDiffuse = nodeVar34;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar35 = normalize( ( nodeVar19 + positionViewDirection ) );
	nodeVar36 = clamp( dot( positionViewDirection, nodeVar35 ), 0.0, 1.0 );
	nodeVar37 = exp2( ( ( ( nodeVar36 * -5.55473 ) - 6.98316 ) * nodeVar36 ) );
	nodeVar38 = ( Roughness * Roughness );
	nodeVar39 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar37 ) ) ) + vec3<f32>( ( 1.0 * nodeVar37 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar38, clamp( dot( normalView, nodeVar19 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar38, clamp( dot( normalView, nodeVar35 ), 0.0, 1.0 ) ) ) );
	nodeVar40 = ( nodeVar22 * nodeVar39 );
	nodeVar41 = ( nodeVar40 * multiScatteringCompensation );
	nodeVar42 = ( directSpecular + nodeVar41 );
	directSpecular = nodeVar42;
	nodeVar43 = ( render.nodeUniform20 - render.nodeUniform21 );
	nodeVar44 = vec4<f32>( nodeVar43, 0.0 );
	nodeVar45 = ( render.cameraViewMatrix * nodeVar44 );
	nodeVar46 = normalize( nodeVar45.xyz );
	nodeVar47 = nodeVar46;
	nodeVar48 = dot( normalView, nodeVar47 );
	nodeVar49 = ( vec3<f32>( clamp( nodeVar48, 0.0, 1.0 ) ) * render.nodeUniform22 );
	nodeVar50 = nodeVar49;
	nodeVar51 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar52 = ( nodeVar50 * nodeVar51 );
	nodeVar53 = ( nodeVar47 + positionViewDirection );
	nodeVar54 = normalize( nodeVar53 );
	nodeVar55 = dot( positionViewDirection, nodeVar54 );
	nodeVar56 = clamp( nodeVar55, 0.0, 1.0 );
	nodeVar57 = exp2( ( ( ( nodeVar56 * -5.55473 ) - 6.98316 ) * nodeVar56 ) );
	nodeVar58 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar57 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar57 ) ) );
	nodeVar59 = ( vec3<f32>( 1.0 ) - nodeVar58 );
	nodeVar60 = nodeVar59;
	nodeVar61 = ( nodeVar52 * nodeVar60 );
	nodeVar62 = ( directDiffuse + nodeVar61 );
	directDiffuse = nodeVar62;
	nodeVar63 = normalize( ( nodeVar47 + positionViewDirection ) );
	nodeVar64 = clamp( dot( positionViewDirection, nodeVar63 ), 0.0, 1.0 );
	nodeVar65 = exp2( ( ( ( nodeVar64 * -5.55473 ) - 6.98316 ) * nodeVar64 ) );
	nodeVar66 = ( Roughness * Roughness );
	nodeVar67 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar65 ) ) ) + vec3<f32>( ( 1.0 * nodeVar65 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar66, clamp( dot( normalView, nodeVar47 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar66, clamp( dot( normalView, nodeVar63 ), 0.0, 1.0 ) ) ) );
	nodeVar68 = ( nodeVar50 * nodeVar67 );
	nodeVar69 = ( nodeVar68 * multiScatteringCompensation );
	nodeVar70 = ( directSpecular + nodeVar69 );
	directSpecular = nodeVar70;
	nodeVar71 = ( render.nodeUniform23 - v_positionView );
	nodeVar72 = normalize( nodeVar71 );
	nodeVar73 = dot( normalView, nodeVar72 );

	if ( ( render.nodeUniform25 > 0.0 ) ) {

		nodeVar75 = length( nodeVar71 );
		nodeVar76 = ( nodeVar75 / render.nodeUniform25 );
		nodeVar77 = clamp( ( 1.0 - ( ( ( nodeVar76 * nodeVar76 ) * nodeVar76 ) * nodeVar76 ) ), 0.0, 1.0 );
		nodeVar74 = ( ( 1.0 / max( pow( nodeVar75, render.nodeUniform26 ), 0.01 ) ) * ( nodeVar77 * nodeVar77 ) );

	} else {

		nodeVar74 = ( 1.0 / max( pow( length( nodeVar71 ), render.nodeUniform26 ), 0.01 ) );

	}

	nodeVar78 = ( render.nodeUniform24 * vec3<f32>( nodeVar74 ) );
	nodeVar79 = ( vec3<f32>( clamp( nodeVar73, 0.0, 1.0 ) ) * nodeVar78 );
	nodeVar80 = nodeVar79;
	nodeVar81 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar82 = ( nodeVar80 * nodeVar81 );
	nodeVar83 = ( nodeVar72 + positionViewDirection );
	nodeVar84 = normalize( nodeVar83 );
	nodeVar85 = dot( positionViewDirection, nodeVar84 );
	nodeVar86 = clamp( nodeVar85, 0.0, 1.0 );
	nodeVar87 = exp2( ( ( ( nodeVar86 * -5.55473 ) - 6.98316 ) * nodeVar86 ) );
	nodeVar88 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar87 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar87 ) ) );
	nodeVar89 = ( vec3<f32>( 1.0 ) - nodeVar88 );
	nodeVar90 = nodeVar89;
	nodeVar91 = ( nodeVar82 * nodeVar90 );
	nodeVar92 = ( directDiffuse + nodeVar91 );
	directDiffuse = nodeVar92;
	nodeVar93 = normalize( ( nodeVar72 + positionViewDirection ) );
	nodeVar94 = clamp( dot( positionViewDirection, nodeVar93 ), 0.0, 1.0 );
	nodeVar95 = exp2( ( ( ( nodeVar94 * -5.55473 ) - 6.98316 ) * nodeVar94 ) );
	nodeVar96 = ( Roughness * Roughness );
	nodeVar97 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar95 ) ) ) + vec3<f32>( ( 1.0 * nodeVar95 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar96, clamp( dot( normalView, nodeVar72 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar96, clamp( dot( normalView, nodeVar93 ), 0.0, 1.0 ) ) ) );
	nodeVar98 = ( nodeVar80 * nodeVar97 );
	nodeVar99 = ( nodeVar98 * multiScatteringCompensation );
	nodeVar100 = ( directSpecular + nodeVar99 );
	directSpecular = nodeVar100;
	nodeVar101 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar102 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar103 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar104 = ( SpecularF90 * dfg.y );
	nodeVar105 = ( nodeVar103 + vec3<f32>( nodeVar104 ) );
	nodeVar106 = ( nodeVar101 + nodeVar105 );
	nodeVar101 = nodeVar106;
	nodeVar107 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar108 = nodeVar107;
	nodeVar109 = ( nodeVar108 * vec3<f32>( 0.047619 ) );
	nodeVar110 = ( SpecularColor + nodeVar109 );
	nodeVar111 = ( nodeVar105 * nodeVar110 );
	nodeVar112 = ( dfg.x + dfg.y );
	nodeVar113 = ( 1.0 - nodeVar112 );
	nodeVar114 = nodeVar113;
	nodeVar115 = ( vec3<f32>( nodeVar114 ) * nodeVar110 );
	nodeVar116 = ( vec3<f32>( 1.0 ) - nodeVar115 );
	nodeVar117 = nodeVar116;
	nodeVar118 = ( nodeVar111 / nodeVar117 );
	nodeVar119 = ( nodeVar118 * vec3<f32>( nodeVar114 ) );
	nodeVar120 = ( nodeVar102 + nodeVar119 );
	nodeVar102 = nodeVar120;
	nodeVar121 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar122 = ( irradiance * nodeVar121 );
	nodeVar123 = ( nodeVar101 + nodeVar102 );
	nodeVar124 = ( vec3<f32>( 1.0 ) - nodeVar123 );
	nodeVar125 = nodeVar124;
	nodeVar126 = ( nodeVar122 * nodeVar125 );
	nodeVar127 = nodeVar126;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar128 = ( indirectDiffuse + nodeVar127 );
	indirectDiffuse = nodeVar128;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar129 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar130 = ( SpecularF90 * dfg.y );
	nodeVar131 = ( nodeVar129 + vec3<f32>( nodeVar130 ) );
	nodeVar132 = ( singleScatteringDielectric + nodeVar131 );
	singleScatteringDielectric = nodeVar132;
	nodeVar133 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar134 = nodeVar133;
	nodeVar135 = ( nodeVar134 * vec3<f32>( 0.047619 ) );
	nodeVar136 = ( SpecularColor + nodeVar135 );
	nodeVar137 = ( nodeVar131 * nodeVar136 );
	nodeVar138 = ( dfg.x + dfg.y );
	nodeVar139 = ( 1.0 - nodeVar138 );
	nodeVar140 = nodeVar139;
	nodeVar141 = ( vec3<f32>( nodeVar140 ) * nodeVar136 );
	nodeVar142 = ( vec3<f32>( 1.0 ) - nodeVar141 );
	nodeVar143 = nodeVar142;
	nodeVar144 = ( nodeVar137 / nodeVar143 );
	nodeVar145 = ( nodeVar144 * vec3<f32>( nodeVar140 ) );
	nodeVar146 = ( multiScatteringDielectric + nodeVar145 );
	multiScatteringDielectric = nodeVar146;
	nodeVar147 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar148 = ( SpecularF90 * dfg.y );
	nodeVar149 = ( nodeVar147 + vec3<f32>( nodeVar148 ) );
	nodeVar150 = ( singleScatteringMetallic + nodeVar149 );
	singleScatteringMetallic = nodeVar150;
	nodeVar151 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar152 = nodeVar151;
	nodeVar153 = ( nodeVar152 * vec3<f32>( 0.047619 ) );
	nodeVar154 = ( DiffuseColor.xyz + nodeVar153 );
	nodeVar155 = ( nodeVar149 * nodeVar154 );
	nodeVar156 = ( dfg.x + dfg.y );
	nodeVar157 = ( 1.0 - nodeVar156 );
	nodeVar158 = nodeVar157;
	nodeVar159 = ( vec3<f32>( nodeVar158 ) * nodeVar154 );
	nodeVar160 = ( vec3<f32>( 1.0 ) - nodeVar159 );
	nodeVar161 = nodeVar160;
	nodeVar162 = ( nodeVar155 / nodeVar161 );
	nodeVar163 = ( nodeVar162 * vec3<f32>( nodeVar158 ) );
	nodeVar164 = ( multiScatteringMetallic + nodeVar163 );
	multiScatteringMetallic = nodeVar164;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar165 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar166 = ( radiance * nodeVar165 );
	nodeVar167 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar168 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar169 = ( nodeVar167 * nodeVar168 );
	nodeVar170 = ( nodeVar166 + nodeVar169 );
	nodeVar171 = nodeVar170;
	nodeVar172 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar173 = ( vec3<f32>( 1.0 ) - nodeVar172 );
	nodeVar174 = nodeVar173;
	nodeVar175 = ( DiffuseContribution * nodeVar174 );
	nodeVar176 = ( nodeVar175 * nodeVar168 );
	nodeVar177 = nodeVar176;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar178 = ( indirectSpecular + nodeVar171 );
	indirectSpecular = nodeVar178;
	nodeVar179 = ( indirectDiffuse + nodeVar177 );
	indirectDiffuse = nodeVar179;
	ambientOcclusion = 1.0;
	nodeVar180 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar180;
	nodeVar181 = dot( normalView, positionViewDirection );
	nodeVar182 = ( clamp( nodeVar181, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar183 = ( Roughness * -16.0 );
	nodeVar184 = ( 1.0 - nodeVar183 );
	nodeVar185 = nodeVar184;
	nodeVar186 = ( - nodeVar185 );
	nodeVar187 = exp2( nodeVar186 );
	nodeVar188 = pow( nodeVar182, nodeVar187 );
	nodeVar189 = ( 1.0 - nodeVar188 );
	nodeVar190 = nodeVar189;
	nodeVar191 = ( ambientOcclusion - nodeVar190 );
	nodeVar192 = ( indirectSpecular * vec3<f32>( clamp( nodeVar191, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar192;
	nodeVar193 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar193;
	nodeVar194 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar194;
	nodeVar195 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar195;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar196 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar197 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform27, object.nodeUniform28, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform30 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform31 * object.nodeUniform31 ) * nodeVar196 ) * nodeVar196 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar197;

	// result

	output.color = nodeVar197;

	return output;

}
